import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { 
    PartyPlayer, 
    PartyChatMessage, 
    PartySubmitAnswerPayload,
    PartyJoinPayload,
    PartyToggleReadyPayload,
    PartyStartGamePayload,
    PartySecretChatPayload,
    PartyLeavePayload
} from '../utils/partyRoom';

interface UsePartyRoomChannelOptions {
    inviteCode: string | null;
    currentUserId: string;
    currentUserNickname: string;
    equippedTitle?: string | null;
    onPlayerJoined?: (player: PartyPlayer) => void;
    onPlayerReadyToggled?: (playerId: string, isReady: boolean) => void;
    onGameStarted?: (quizzes: any[]) => void;
    onAnswerSubmitted?: (payload: PartySubmitAnswerPayload) => void;
    onSecretChatReceived?: (msg: PartyChatMessage) => void;
    onPlayerLeft?: (playerId: string) => void;
}

export function usePartyRoomChannel({
    inviteCode,
    currentUserId,
    currentUserNickname,
    equippedTitle,
    onPlayerJoined,
    onPlayerReadyToggled,
    onGameStarted,
    onAnswerSubmitted,
    onSecretChatReceived,
    onPlayerLeft
}: UsePartyRoomChannelOptions) {
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!inviteCode) return;

        const channelName = `party:${inviteCode}`;
        const channel = supabase.channel(channelName, {
            config: {
                broadcast: { self: false },
                presence: { key: currentUserId }
            }
        });

        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'JOIN_PLAYER' }, (payload) => {
                const data = payload.payload as PartyJoinPayload;
                if (data?.player && onPlayerJoined) {
                    onPlayerJoined(data.player);
                }
            })
            .on('broadcast', { event: 'TOGGLE_READY' }, (payload) => {
                const data = payload.payload as PartyToggleReadyPayload;
                if (data?.playerId && onPlayerReadyToggled) {
                    onPlayerReadyToggled(data.playerId, data.isReady);
                }
            })
            .on('broadcast', { event: 'START_GAME' }, (payload) => {
                const data = payload.payload as PartyStartGamePayload;
                if (data?.quizzes && onGameStarted) {
                    onGameStarted(data.quizzes);
                }
            })
            .on('broadcast', { event: 'SUBMIT_ANSWER' }, (payload) => {
                const data = payload.payload as PartySubmitAnswerPayload;
                if (data && onAnswerSubmitted) {
                    onAnswerSubmitted(data);
                }
            })
            .on('broadcast', { event: 'SECRET_CHAT' }, (payload) => {
                const data = payload.payload as PartySecretChatPayload;
                if (data?.message && onSecretChatReceived) {
                    onSecretChatReceived(data.message);
                }
            })
            .on('broadcast', { event: 'LEAVE_PLAYER' }, (payload) => {
                const data = payload.payload as PartyLeavePayload;
                if (data?.playerId && onPlayerLeft) {
                    onPlayerLeft(data.playerId);
                }
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                leftPresences.forEach((presence: any) => {
                    if (presence.key && onPlayerLeft) {
                        onPlayerLeft(presence.key);
                    }
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        userId: currentUserId,
                        nickname: currentUserNickname,
                        equippedTitle: equippedTitle || null,
                        joinedAt: new Date().toISOString()
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [inviteCode, currentUserId]);

    const broadcastJoin = (player: PartyPlayer) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'JOIN_PLAYER',
                payload: { player }
            });
        }
    };

    const broadcastToggleReady = (playerId: string, isReady: boolean) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'TOGGLE_READY',
                payload: { playerId, isReady }
            });
        }
    };

    const broadcastStartGame = (quizzes: any[]) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'START_GAME',
                payload: { quizzes }
            });
        }
    };

    const broadcastSubmitAnswer = (payload: PartySubmitAnswerPayload) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'SUBMIT_ANSWER',
                payload
            });
        }
    };

    const broadcastSecretChat = (message: PartyChatMessage) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'SECRET_CHAT',
                payload: { message }
            });
        }
    };

    const broadcastLeave = (playerId: string) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'LEAVE_PLAYER',
                payload: { playerId }
            });
        }
    };

    return {
        broadcastJoin,
        broadcastToggleReady,
        broadcastStartGame,
        broadcastSubmitAnswer,
        broadcastSecretChat,
        broadcastLeave
    };
}
