import type { TOrdersData } from '../../../utils/types';

export type FeedInfoUIProps = {
  // базовые поля orders/total/totalToday + возможные флаги загрузки/ошибки
  feed: TOrdersData & { isLoading?: boolean; error?: string | null };
  readyOrders: number[];
  pendingOrders: number[];
};

export type HalfColumnProps = {
  orders: number[];
  title: string;
  textColor?: string;
};

export type TColumnProps = {
  title: string;
  content: number;
};
