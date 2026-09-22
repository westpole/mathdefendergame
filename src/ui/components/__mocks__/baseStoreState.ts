import type { GameStoreState } from '@store/types';

import baseStoreStateJson from './base-store-state.json';

const baseStoreState = structuredClone(baseStoreStateJson) as Partial<GameStoreState>;

export default baseStoreState;
