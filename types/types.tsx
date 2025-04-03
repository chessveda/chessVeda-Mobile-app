export interface GameStats {
    wins: number;
    losses: number;
    drawn: number;
  }
  
  export interface RecentGame {
    opponent: string;
    rating: number;
    result: 'win' | 'loss' | 'draw';
    gameType: 'bullet' | 'blitz' | 'rapid' | 'classical';
  }
  
  export interface UserProfile {
    username: string;
    name: string;
    title?: string;
    ratings: {
      rapid: number;
      bullet: number;
      daily: number;
      classical: number;
      blitz: number;
      freestyle: number;
    };
  }
  