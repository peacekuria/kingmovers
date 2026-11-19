import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMeQuery, useInventoryQuery } from '../../api/api';
import { userRefreshed } from './authSlice';
import { hydrate } from '../inventory/inventorySlice';

// Keeps the cached user fresh (role/suspension changes) and loads the client's saved inventory.
export default function SessionSync() {
  const user = useSelector((s) => s.auth.user);
  const loaded = useSelector((s) => s.inventory.loaded);
  const dispatch = useDispatch();
  const { data: me } = useMeQuery(undefined, { skip: !user, refetchOnFocus: true });
  const { data: inv, isSuccess } = useInventoryQuery(undefined, { skip: user?.role !== 'client' || loaded });
  useEffect(() => { if (me?.user) dispatch(userRefreshed(me.user)); }, [me, dispatch]);
  useEffect(() => { if (isSuccess && !loaded) dispatch(hydrate(inv.inventory)); }, [isSuccess, inv, loaded, dispatch]);
  return null;
}
