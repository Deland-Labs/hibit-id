import { FC } from "react";

const PageLoading: FC = () => {
  return (
    <div className="h-full flex justify-center items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  )
}

export default PageLoading
