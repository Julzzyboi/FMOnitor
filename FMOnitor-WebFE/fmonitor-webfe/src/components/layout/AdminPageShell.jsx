import useDelayedLoading from '../../hooks/useDelayedLoading'
import PageSkeleton from '../common/PageSkeleton'

function AdminPageShell({ children, fullBleed = false, skipSkeleton = false }) {
  const delayedLoading = useDelayedLoading()
  const loading = !skipSkeleton && delayedLoading

  if (loading) return <PageSkeleton />

  const className = fullBleed
    ? 'animate-[fade-in_0.4s_ease-out_forwards]'
    : 'animate-[fade-in_0.4s_ease-out_forwards] p-4 sm:p-6 lg:p-8'

  return <div className={className}>{children}</div>
}

export default AdminPageShell
