export type TimeControlType = 'bullet' | 'blitz' | 'rapid' | 'classical';

export interface GameStats {
  gamesPlayed: Record<TimeControlType, number>;
  wins: Record<TimeControlType, number>;
  losses: Record<TimeControlType, number>;
  draws: Record<TimeControlType, number>;
}

export interface GameHistoryEntry {
  gameId: string;
  timeControl: TimeControlType;
  result: 'win' | 'loss' | 'draw';
  ratingChange: number;
  opponentId: string;
  timestamp: Date;
}

export interface RatingHistoryEntry {
  timeControl: TimeControlType;
  rating: number;
  timestamp: Date;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  gender: 'Male' | 'Female';
  dob: Date;
  country: string;
  
  // Legacy fields (might be deprecated in future)
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  
  // Current fields
  ratings: {
    bullet: number;
    blitz: number;
    rapid: number;
    classical: number;
  };
  stats: GameStats;
  gameHistory: GameHistoryEntry[];
  ratingHistory: RatingHistoryEntry[];
}

// Optional: If you need a simplified version for certain views
export interface SimplifiedUserProfile {
  name: string;
  ratings: {
    bullet: number;
    blitz: number;
    rapid: number;
    classical: number;
  };
  stats: {
    rapid: {
      gamesPlayed: number;
      wins: number;
      losses: number;
      draws: number;
    }
  };
}




