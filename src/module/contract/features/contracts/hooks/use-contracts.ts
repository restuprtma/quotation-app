import type { Contract, PublicContract, SignContractPayload, CreateContractPayload, UpdateContractPayload } from '../../../types';

import { useState, useEffect, useCallback } from 'react';

import { contractApi } from '../../../api';

export function useContracts() {
  const [data, setData] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await contractApi.list();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return { data, isLoading, refetch: fetchContracts };
}

export function useContract(id: string) {
  const [data, setData] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchContract = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await contractApi.get(id);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  return { data, isLoading, refetch: fetchContract };
}

export function useCreateContract() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (payload: CreateContractPayload) => {
    setIsPending(true);
    try {
      return await contractApi.create(payload);
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useUpdateContract(id: string) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (payload: UpdateContractPayload) => {
    setIsPending(true);
    try {
      return await contractApi.update(id, payload);
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

export function useShareContract(id: string) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async () => {
    setIsPending(true);
    try {
      return await contractApi.share(id);
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

// Public Hooks
export function usePublicContract(token: string) {
  const [data, setData] = useState<PublicContract | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    setIsLoading(true);
    
    contractApi.getPublic(token)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [token]);

  return { data, isLoading };
}

export function useSignPublicContract(token: string) {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (payload: SignContractPayload) => {
    setIsPending(true);
    try {
      return await contractApi.signPublic(token, payload);
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
