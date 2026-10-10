import type { StoreApi } from 'zustand';

import type { GameStoreState } from '../types';

export type GameStoreSetState = StoreApi<GameStoreState>['setState'];
export type GameStoreGetState = StoreApi<GameStoreState>['getState'];

