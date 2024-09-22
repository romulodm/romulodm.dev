import { Skeleton } from "@mui/material";

export default function PostSkeleton() {
  return (
    <div className="flex w-full flex-col animate-pulse">
      <div className="w-full">
        <div className="p-5 w-full rounded border bg-white dark:bg-neutral-900 dark:border-neutral-800">

          <div className="w-full flex items-center justify-center mb-3 h-72 bg-gray-200 dark:bg-neutral-700 rounded-lg">
            <svg className="w-20 h-20 text-gray-100 dark:text-neutral-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 20">
                <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z"/>
                <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z"/>
            </svg>
          </div>

          <div className="flex items-center justify-between lg:py-1">
            <div className="flex items-center">
              <div className="rounded-full flex justify-center items-center h-[41px] w-[41px] bg-gray-200 dark:bg-neutral-700 mr-2">
                <svg className="w-3 h-3 text-gray-100 dark:text-neutral-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 20">
                  <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z"/>
                  <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-16"></div>
              </div>
            </div>

            <div className="flex gap-x-1.5">
              <div className="h-5 w-16 bg-gray-200 dark:bg-neutral-700 rounded"></div>
              <div className="h-5 w-8 bg-gray-200 dark:bg-neutral-700 rounded"></div>
            </div>
          </div>

          <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mt-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/2 mt-2 mb-3"></div>

          <div className="h-[1px] bg-gray-200 dark:bg-neutral-600 my-3"></div>

            <div className="flex w-full px-1 md:px-0 flex-row justify-between py-2">
              <div className="flex gap-7">
                  <div className="flex items-center justify-center flex-row gap-2">
                      <div className="rounded-md w-2 h-2 bg-gray-200 dark:bg-neutral-600" />
                      <div className="rounded-md h-2 w-4 bg-gray-200 dark:bg-neutral-600" />
                  </div>

                  <div className="flex items-center justify-center flex-row gap-2">
                    <div className="rounded-xl w-2 h-2 bg-gray-200 dark:bg-neutral-600" />
                    <div className="rounded-md h-2 w-4 bg-gray-200 dark:bg-neutral-600" />
                  </div>

                  <div className="flex items-center justify-center flex-row gap-2">
                    <div className="rounded-md w-2 h-2 bg-gray-200 dark:bg-neutral-600" />
                    <div className="rounded-md h-2 w-4 bg-gray-200 dark:bg-neutral-600" />
                  </div>
              </div>

              <div className="flex gap-7">
                  <div className="flex items-center justify-center flex-row">
                    <div className="rounded-xl w-2 h-2 bg-gray-200 dark:bg-neutral-600" />
                  </div>
              </div>
          </div>

          <div className="h-[1px] bg-gray-200 dark:bg-neutral-600 my-3"></div>

          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
}
