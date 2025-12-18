import { RequestStatus, StatusInfo } from '@/types/bloodRequest';
import { STATUS_MAP } from '@/constants/bloodRequest';

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const statusInfo: StatusInfo = STATUS_MAP[status] || STATUS_MAP.pending;

  return (
    <span
      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color} ${className}`}
    >
      {statusInfo.label}
    </span>
  );
};
