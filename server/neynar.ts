// Neynar API client for Farcaster interactions

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '';
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  verified_addresses: {
    eth_addresses: string[];
  };
}

interface NeynarReaction {
  fid: number;
  fname: string;
}

interface NeynarCast {
  hash: string;
  author: NeynarUser;
  reactions: {
    likes: NeynarReaction[];
    recasts: NeynarReaction[];
  };
}

interface TaskVerificationResult {
  liked: boolean;
  recasted: boolean;
  followed: boolean;
}

/**
 * Get user by FID
 */
export async function getUserByFid(fid: number): Promise<NeynarUser | null> {
  try {
    const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.users?.[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Get user by custody or verified address
 */
export async function getUserByAddress(address: string): Promise<NeynarUser | null> {
  try {
    const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/user/bulk-by-address?addresses=${address}`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user by address:', response.statusText);
      return null;
    }

    const data = await response.json();
    const users = data[address.toLowerCase()];
    return users?.[0] || null;
  } catch (error) {
    console.error('Error fetching user by address:', error);
    return null;
  }
}

/**
 * Get cast by hash
 */
export async function getCast(castHash: string): Promise<NeynarCast | null> {
  try {
    // Ensure the hash has the 0x prefix
    const hash = castHash.startsWith('0x') ? castHash : `0x${castHash}`;
    
    const response = await fetch(`${NEYNAR_BASE_URL}/farcaster/cast?identifier=${hash}&type=hash`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch cast:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.cast || null;
  } catch (error) {
    console.error('Error fetching cast:', error);
    return null;
  }
}

/**
 * Check if user has liked a cast
 */
export async function hasUserLikedCast(userFid: number, castHash: string): Promise<boolean> {
  try {
    const cast = await getCast(castHash);
    if (!cast) return false;

    return cast.reactions.likes.some(like => like.fid === userFid);
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
}

/**
 * Check if user has recasted a cast
 */
export async function hasUserRecastedCast(userFid: number, castHash: string): Promise<boolean> {
  try {
    const cast = await getCast(castHash);
    if (!cast) return false;

    return cast.reactions.recasts.some(recast => recast.fid === userFid);
  } catch (error) {
    console.error('Error checking recast status:', error);
    return false;
  }
}

/**
 * Check if user follows another user
 */
export async function doesUserFollow(followerFid: number, targetFid: number): Promise<boolean> {
  try {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${followerFid}&viewer_fid=${targetFid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to check follow status:', response.statusText);
      return false;
    }

    const data = await response.json();
    const user = data.users?.[0];
    
    // Check viewer_context for following relationship
    return user?.viewer_context?.followed_by === true;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

/**
 * Verify all tasks for a user
 */
export async function verifyAllTasks(
  userFid: number,
  targetCastHash: string,
  targetUserFid: number
): Promise<TaskVerificationResult> {
  const [liked, recasted, followed] = await Promise.all([
    hasUserLikedCast(userFid, targetCastHash),
    hasUserRecastedCast(userFid, targetCastHash),
    doesUserFollow(userFid, targetUserFid),
  ]);

  return { liked, recasted, followed };
}

/**
 * Verify a specific task for a user
 */
export async function verifyTask(
  userFid: number,
  taskType: 'like' | 'recast' | 'follow',
  targetCastHash: string,
  targetUserFid: number
): Promise<boolean> {
  switch (taskType) {
    case 'like':
      return hasUserLikedCast(userFid, targetCastHash);
    case 'recast':
      return hasUserRecastedCast(userFid, targetCastHash);
    case 'follow':
      return doesUserFollow(userFid, targetUserFid);
    default:
      return false;
  }
}
