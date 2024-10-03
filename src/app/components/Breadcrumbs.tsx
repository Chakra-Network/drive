import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

interface BreadcrumbsProps {
  path: Array<{ id: string; name: string }>;
}

function Breadcrumbs({ path }: BreadcrumbsProps): React.ReactElement {
  const isEmptyPath =
    path.length === 0 || (path.length === 1 && path[0].id === '' && path[0].name === '');
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:underline"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Link>
        </li>
        {!isEmptyPath &&
          path.length > 0 &&
          path.map((segment, index) => {
            const href = `/${path
              .slice(0, index + 1)
              .map(s => s.id)
              .join('/')}`;
            const isLast = index === path.length - 1;
            return (
              <li key={segment.id}>
                <div className="flex items-center">
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                  {isLast ? (
                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                      {segment.name}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="ml-1 text-sm font-medium text-gray-700 hover:underline md:ml-2"
                    >
                      {segment.name}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
