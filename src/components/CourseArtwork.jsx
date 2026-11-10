function CourseArtwork({ course }) {
  return (
    <img
      className="aspect-video w-full object-cover"
      src={course.thumbnail}
      alt={`${course.title} course thumbnail`}
    />
  )
}

export default CourseArtwork
