import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { TripMember, MemberRole } from '@/types'

export function useMembers(tripId: string | undefined) {
  return useQuery({
    queryKey: ['members', tripId],
    queryFn: async (): Promise<TripMember[]> => {
      if (!tripId) return []

      const { data, error } = await supabase
        .from('trip_members')
        .select(`
          *,
          profile:profiles(id, email, display_name, avatar_url)
        `)
        .eq('trip_id', tripId)

      if (error) throw new Error(error.message)
      return data as TripMember[]
    },
    enabled: !!tripId,
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({
      tripId,
      email,
      role,
    }: {
      tripId: string
      email: string
      role: MemberRole
    }): Promise<void> => {
      // Check if user exists
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profiles) {
        // User exists, add directly
        const { error } = await supabase
          .from('trip_members')
          .insert({ trip_id: tripId, user_id: profiles.id, role })

        if (error) {
          if (error.code === '23505') {
            throw new Error('This user is already a member of this trip')
          }
          throw new Error(error.message)
        }
      } else {
        // Create invitation
        const { error } = await supabase.from('trip_invitations').insert({
          trip_id: tripId,
          invited_email: email,
          role,
        })
        if (error) throw new Error(error.message)
        toast.info('Invitation created. User will be added when they sign up.')
      }
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['members', tripId] })
      toast.success('Member invited!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({
      memberId,
      tripId,
      role,
    }: {
      memberId: string
      tripId: string
      role: MemberRole
    }): Promise<void> => {
      const { error } = await supabase
        .from('trip_members')
        .update({ role })
        .eq('id', memberId)

      if (error) throw new Error(error.message)
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['members', tripId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({
      memberId,
      tripId,
    }: {
      memberId: string
      tripId: string
    }): Promise<{ tripId: string }> => {
      const { error } = await supabase.from('trip_members').delete().eq('id', memberId)
      if (error) throw new Error(error.message)
      return { tripId }
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['members', tripId] })
      toast.success('Member removed')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
