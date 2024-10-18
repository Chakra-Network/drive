import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createFileEntryResponse } from '@/lib/fileUtils';

const DuplicateFileEntrySchema = z.object({
  name: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const tokenPayload = await verifyToken(request);
  if (!tokenPayload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = DuplicateFileEntrySchema.parse(body);

    const file = await prisma.fileEntry.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    if (file.type === 'folder') {
      return NextResponse.json(
        { success: false, error: 'Folders cannot be duplicated' },
        { status: 400 }
      );
    }

    const duplicateFile = await prisma.fileEntry.create({
      data: {
        folderId: file.folderId,
        name,
        ownerPK: tokenPayload.wallet,
        type: file.type,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
        isPrivate: file.isPrivate,
        createdAt: new Date(),
        updatedAt: new Date(),
        privateVersion: file.privateVersion,
      },
    });

    // Note, since we're duplicating the file in our database and not reuploading to iris,
    // the user's storage doesn't increase

    const response = createFileEntryResponse(duplicateFile);
    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error creating file entry:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create file entry' },
      { status: 500 }
    );
  }
}
