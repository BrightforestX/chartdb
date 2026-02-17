import { useContext } from 'react';
import { NangoContext } from '@/context/nango-context';

export const useNango = () => useContext(NangoContext);
