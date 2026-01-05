import { useMemo } from 'react';
import { FulfillmentRequest, DonorConfirmation } from '@/types/fulfillment';

export function useFulfillmentStats(
  fulfillment: FulfillmentRequest | null,
  confirmations: DonorConfirmation[]
) {
  return useMemo(() => {
    if (!fulfillment) {
      return {
        progressPercentage: 0,
        confirmedCount: 0,
        completedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        expiredCount: 0,
        failedCount: 0,
        totalNotified: 0,
        responseRate: 0,
        completionRate: 0,
        quantityProgress: 0,
        isCompleted: false,
        isCancelled: false,
        canInitiate: false,
      };
    }

    const confirmedCount = confirmations.filter(c => c.status === 'confirmed').length;
    const completedCount = confirmations.filter(c => c.status === 'completed').length;
    const pendingCount = confirmations.filter(c => c.status === 'pending').length;
    const rejectedCount = confirmations.filter(c => c.status === 'rejected').length;
    const expiredCount = confirmations.filter(c => c.status === 'expired').length;
    const failedCount = confirmations.filter(c => c.status === 'failed').length;
    const totalNotified = confirmations.length;

    const responseRate = totalNotified > 0 
      ? Math.round(((confirmedCount + rejectedCount) / totalNotified) * 100) 
      : 0;

    const completionRate = confirmedCount > 0 
      ? Math.round((completedCount / confirmedCount) * 100) 
      : 0;

    const quantityProgress = fulfillment.quantity_needed > 0
      ? Math.round((fulfillment.quantity_collected / fulfillment.quantity_needed) * 100)
      : 0;

    const progressPercentage = Math.min(quantityProgress, 100);

    const isCompleted = fulfillment.status === 'fulfilled' || 
                       fulfillment.quantity_collected >= fulfillment.quantity_needed;

    const isCancelled = fulfillment.status === 'cancelled';

    const canInitiate = fulfillment.status === 'initiated';

    return {
      progressPercentage,
      confirmedCount,
      completedCount,
      pendingCount,
      rejectedCount,
      expiredCount,
      failedCount,
      totalNotified,
      responseRate,
      completionRate,
      quantityProgress,
      isCompleted,
      isCancelled,
      canInitiate,
    };
  }, [fulfillment, confirmations]);
}
