import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { UserPlus, Users, Crown, Edit2, Eye, Trash2 } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useMembers, useInviteMember, useRemoveMember } from '@/hooks/useMembers'
import { isOwner } from '@/store/tripStore'
import { useTripStore } from '@/store/tripStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils/cn'
import type { MemberRole, TripMember } from '@/types'

const ROLE_ICONS = {
  owner: Crown,
  editor: Edit2,
  viewer: Eye,
}

const ROLE_COLORS = {
  owner: 'text-yellow-600 bg-yellow-50',
  editor: 'text-blue-600 bg-blue-50',
  viewer: 'text-gray-600 bg-gray-100',
}

interface InviteFormData {
  email: string
  role: MemberRole
}

export function MembersPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [showInvite, setShowInvite] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<TripMember | null>(null)
  const [inviteData, setInviteData] = useState<InviteFormData>({
    email: '',
    role: 'editor',
  })
  const { userRole } = useTripStore()
  const { user } = useAuth()

  const { data: members, isLoading } = useMembers(tripId)
  const inviteMember = useInviteMember()
  const removeMember = useRemoveMember()

  const handleInvite = async () => {
    if (!inviteData.email) return
    await inviteMember.mutateAsync({
      tripId: tripId!,
      email: inviteData.email,
      role: inviteData.role,
    })
    setShowInvite(false)
    setInviteData({ email: '', role: 'editor' })
  }

  if (isLoading) return <PageSpinner />

  return (
    <>
      <TopBar
        title="Members"
        showBack
        actions={
          isOwner(userRole) ? (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={16} />
            </Button>
          ) : null
        }
      />

      <PageContainer>
        {!members?.length ? (
          <EmptyState
            icon={Users}
            title="No members"
            description="Invite people to collaborate on this trip"
            action={
              isOwner(userRole)
                ? { label: 'Invite Member', onClick: () => setShowInvite(true) }
                : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role] || Eye
              const isCurrentUser = member.user_id === user?.id
              const profile = member.profile

              return (
                <Card key={member.id} padding="sm">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={profile?.display_name || profile?.email}
                      src={profile?.avatar_url}
                      size="sm"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--color-text)] truncate">
                          {profile?.display_name || profile?.email}
                          {isCurrentUser && (
                            <span className="text-[var(--color-text-muted)] text-xs ml-1">(you)</span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {profile?.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                          ROLE_COLORS[member.role]
                        )}
                      >
                        <RoleIcon size={11} />
                        {member.role}
                      </span>

                      {isOwner(userRole) && !isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveTarget(member)}
                          className="px-1.5 py-1"
                        >
                          <Trash2 size={13} className="text-red-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </PageContainer>

      {/* Invite modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Member">
        <div className="p-4 space-y-3">
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@example.com"
            value={inviteData.email}
            onChange={(e) => setInviteData((d) => ({ ...d, email: e.target.value }))}
          />
          <Select
            label="Role"
            value={inviteData.role}
            onChange={(e) => setInviteData((d) => ({ ...d, role: e.target.value as MemberRole }))}
            options={[
              { value: 'editor', label: 'Editor – can add and edit items' },
              { value: 'viewer', label: 'Viewer – read only' },
            ]}
          />
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => setShowInvite(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              loading={inviteMember.isPending}
              disabled={!inviteData.email}
              className="flex-1"
            >
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) {
            removeMember.mutate({ memberId: removeTarget.id, tripId: tripId! })
          }
          setRemoveTarget(null)
        }}
        title="Remove Member"
        message={`Remove ${removeTarget?.profile?.display_name || removeTarget?.profile?.email} from this trip?`}
        confirmLabel="Remove"
        loading={removeMember.isPending}
      />
    </>
  )
}
