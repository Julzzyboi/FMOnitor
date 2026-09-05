import useDelayedLoading from '../../hooks/useDelayedLoading'
import PageSkeleton from '../common/PageSkeleton'

/**
 * Shared shell for admin pages: shows a skeleton loader briefly, then
 * fades in the page content. Pages are blank placeholders for now — pass
 * children once a page has real content to render.
 *
 * `fullBleed` skips the default p-4/sm:p-6/lg:p-8 padding, for a page (like
 * CampusMap) that wants to fill all the way to the topbar/sidebar edges
 * instead of sitting inset from them.
 */
function AdminPageShell({ children, fullBleed = false }) {
  const loading = useDelayedLoading()

  if (loading) return <PageSkeleton />

  const className = fullBleed
    ? 'animate-[fade-in_0.4s_ease-out_forwards]'
    : 'animate-[fade-in_0.4s_ease-out_forwards] p-4 sm:p-6 lg:p-8'

  return <div className={className}>{children}</div>
}

export default AdminPageShell
