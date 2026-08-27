import useDelayedLoading from '../../hooks/useDelayedLoading'
import PageSkeleton from '../common/PageSkeleton'

/**
 * Shared shell for admin pages: shows a skeleton loader briefly, then
 * fades in the page content. Pages are blank placeholders for now — pass
 * children once a page has real content to render.
 */
function AdminPageShell({ children }) {
  const loading = useDelayedLoading()

  if (loading) return <PageSkeleton />

  return <div className="animate-[fade-in_0.4s_ease-out_forwards] p-8">{children}</div>
}

export default AdminPageShell
