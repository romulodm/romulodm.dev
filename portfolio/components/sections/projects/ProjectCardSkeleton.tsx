export default function ProjectCardSkeleton() {
    return (
        <div className="p-6 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 animate-pulse">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-5 border rounded-md bg-gray-200 dark:border-neutral-600 dark:bg-neutral-700" />
                <div className="h-2.5 bg-gray-200 dark:bg-neutral-700 rounded-md w-20" />
            </div>

            <div className="flex gap-2 items-center">
                <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded-md w-4 mb-4" />
                <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded-md w-24 mb-4" />
            </div>
            <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded-full mb-2.5" />
            <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded-full" />

            <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2 items-center">
                    <div className="flex gap-1 items-center">
                        <div className="bg-gray-200 dark:bg-neutral-700 rounded-full w-4 h-4" />
                        <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded-full w-6" />
                    </div>
                    <div className="flex gap-1 items-center">
                        <div className="bg-gray-200 dark:bg-neutral-700 rounded-full w-4 h-4" />
                        <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded-full w-6" />
                    </div>
                </div>
                <div className="w-24 p-5 bg-gray-200 dark:bg-neutral-700 rounded-md" />
            </div>
        </div>
    );
}