export interface Quiz {
    target_station_id: number;
    target_station_name: string;
    line_name: string;
    color_code: string;
    left_2: string;
    left_1: string;
    right_1: string;
    right_2: string;
}

export interface RankingEntry {
    id: string;
    player_id: string;
    nickname: string;
    score: number;
    line_ids?: number[];
    line_summary?: string;
    created_at: string;
}

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'score' | 'info';
    message: string;
}

export interface LobbyRoom {
    id: string;
    room_title: string;
    player_1: string;
    player_2: string | null;
    status: RoomStatus;
    selected_line_ids: number[] | null;
    player_count: number;
    created_at: string;
    is_private?: boolean;
    has_password?: boolean;
    invite_code?: string;
}

export type GameMode = 'MENU' | 'SINGLE' | 'MULTIPLAYER' | 'LOBBY';
export type PlayerRole = 'player_1' | 'player_2' | null;
export type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED';
