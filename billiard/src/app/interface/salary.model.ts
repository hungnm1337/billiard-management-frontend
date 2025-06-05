export interface Salary {
  id: number;
  userId: number;
  salary1: number;
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
}
