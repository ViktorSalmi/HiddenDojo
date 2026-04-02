import { useEffect, useState } from "react";

import {
  createCamp as createCampQuery,
  createMember as createMemberQuery,
  deleteCamp as deleteCampQuery,
  deleteTrainingSession as deleteTrainingSessionQuery,
  fetchDashboardData,
  permanentlyDeleteMember as permanentlyDeleteMemberQuery,
  saveTrainingSession as saveTrainingSessionQuery,
  softDeleteMember as softDeleteMemberQuery,
  toggleCampAttendance as toggleCampAttendanceQuery,
  updateCamp as updateCampQuery,
  updateMember as updateMemberQuery,
  type CampMutationInput,
  type MemberMutationInput,
  type MembersDashboardData,
  type TrainingSessionMutationInput,
} from "@/lib/supabase/queries";

type UseDashboardDataOptions = {
  enabled?: boolean;
};

export type UseDashboardDataResult = MembersDashboardData & {
  createCamp: (input: CampMutationInput) => Promise<void>;
  createMember: (input: MemberMutationInput) => Promise<void>;
  deleteCamp: (id: string) => Promise<void>;
  deleteTrainingSession: (id: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
  isMutating: boolean;
  permanentlyDeleteMember: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  saveTrainingSession: (input: TrainingSessionMutationInput) => Promise<void>;
  softDeleteMember: (id: string) => Promise<void>;
  toggleCampAttendance: (campId: string, memberId: string) => Promise<void>;
  updateCamp: (id: string, input: CampMutationInput) => Promise<void>;
  updateMember: (id: string, input: MemberMutationInput) => Promise<void>;
};

const emptyData: MembersDashboardData = {
  archivedMembers: [],
  camps: [],
  members: [],
  sessions: [],
  sidebar: {
    activeMembers: 0,
    averageAttendancePercent: 0,
  },
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Kunde inte hämta dashboard-data.";
}

export function useDashboardData(
  options: UseDashboardDataOptions = {},
): UseDashboardDataResult {
  const { enabled = true } = options;
  const [data, setData] = useState<MembersDashboardData>(emptyData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isMutating, setIsMutating] = useState(false);

  async function refresh() {
    if (!enabled) {
      setData(emptyData);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextData = await fetchDashboardData();
      setData(nextData);
      setError(null);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  }

  async function runMutation(action: () => Promise<void>) {
    setIsMutating(true);

    try {
      await action();
      await refresh();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      throw nextError;
    } finally {
      setIsMutating(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [enabled]);

  return {
    ...data,
    async createCamp(input) {
      await runMutation(async () => {
        await createCampQuery(input);
      });
    },
    async createMember(input) {
      await runMutation(async () => {
        await createMemberQuery(input);
      });
    },
    async deleteCamp(id) {
      await runMutation(async () => {
        await deleteCampQuery(id);
      });
    },
    async deleteTrainingSession(id) {
      await runMutation(async () => {
        await deleteTrainingSessionQuery(id);
      });
    },
    error,
    isLoading,
    isMutating,
    async permanentlyDeleteMember(id) {
      await runMutation(async () => {
        await permanentlyDeleteMemberQuery(id);
      });
    },
    refresh,
    async saveTrainingSession(input) {
      await runMutation(async () => {
        await saveTrainingSessionQuery(input);
      });
    },
    async softDeleteMember(id) {
      await runMutation(async () => {
        await softDeleteMemberQuery(id);
      });
    },
    async toggleCampAttendance(campId, memberId) {
      await runMutation(async () => {
        await toggleCampAttendanceQuery(campId, memberId);
      });
    },
    async updateCamp(id, input) {
      await runMutation(async () => {
        await updateCampQuery(id, input);
      });
    },
    async updateMember(id, input) {
      await runMutation(async () => {
        await updateMemberQuery(id, input);
      });
    },
  };
}

