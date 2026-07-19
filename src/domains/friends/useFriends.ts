import { useState, useEffect, useCallback } from "react";
import {
listMyFriends, listPendingReceived, listPendingChallenges,
sendFriendRequest, acceptRequest, declineRequest, sendChallenge, respondToChallenge,
type Friendship, type DirectChallenge,
} from "./repository";

export function useFriends() {
const [friends, setFriends] = useState<Friendship[]>([]);
const [pending, setPending] = useState<Friendship[]>([]);
const [challenges, setChallenges] = useState<DirectChallenge[]>([]);
const [loading, setLoading] = useState(true);

const reload = useCallback(async () => {
  setLoading(true);
  const [f, p, c] = await Promise.all([listMyFriends(), listPendingReceived(), listPendingChallenges()]);
  setFriends(f.data ?? []);
  setPending(p.data ?? []);
  setChallenges(c.data ?? []);
  setLoading(false);
}, []);

useEffect(() => { reload(); }, [reload]);

const addFriend = useCallback(async (id: string) => {
  const r = await sendFriendRequest(id); if (r.ok) reload(); return r;
}, [reload]);
const accept = useCallback(async (id: string) => { await acceptRequest(id); reload(); }, [reload]);
const decline = useCallback(async (id: string) => { await declineRequest(id); reload(); }, [reload]);
const challenge = useCallback(async (id: string) => {
  const r = await sendChallenge(id); if (r.ok) reload(); return r;
}, [reload]);
const respondChallenge = useCallback(async (id: string, acc: boolean) => {
  await respondToChallenge(id, acc); reload();
}, [reload]);

return { friends, pending, challenges, loading, addFriend, accept, decline, challenge, respondChallenge, reload };
}
