import { useState } from 'react'

// Some thumbnails are hotlinked from other sites. If one fails to load, show a
// cardinal tile with the course code instead of a broken image.
function CourseArtwork({ course }) {
  const [failed, setFailed] = useState(false)

  if (failed || !course.thumbnail) {
    return (
      <div className="art art--fallback" role="img" aria-label={`${course.code} course artwork`}>
        <span>{course.code}</span>
      </div>
    )
  }

  return (
    <img
      className="art"
      src={course.thumbnail}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

export default CourseArtwork
