import { Card, CardContent } from '@/app/components/ui/card';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import React from 'react';

interface NotificationProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  // eslint-disable-next-line react/require-default-props
  duration?: number;
  // eslint-disable-next-line react/require-default-props
  onClose?: () => void;
}

function Notification({
  type,
  title,
  message,
  duration = 5000,
  onClose = () => {},
}: NotificationProps) {
  const [isDismissed, setIsDismissed] = React.useState<boolean>(false);

  const handleClose = React.useCallback(() => {
    setIsDismissed(true);
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    const timeout = setTimeout(handleClose, duration);
    return () => clearTimeout(timeout);
  }, [duration, handleClose]);

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <Card className="w-64 bg-white shadow-lg">
        <CardContent className="p-4 flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center">
              {type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Notification;
