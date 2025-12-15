function Output({expanded, loading, displayedSummary}){
    {/* OUTPUT BOX */}
    return(
        expanded && (
            <div className={`min-h-[200px] max-h-[450px] sm:min-h-[300px] bg-white dark:bg-[#111] border output-box border-gray-200 dark:border-gray-800 p-4 sm:p-5 rounded-xl shadow-md dark:shadow-none overflow-y-auto transition-all duration-500 ease-out order-2 lg:order-none w-full lg:w-5/12
                ${expanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`
            }>
                
                {loading ? 
                <div className="flex items-center justify-center h-full">
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full animate-spin-pulse"></div>                
                </div>
                : 
                <pre className="whitespace-pre-wrap break-words font-sans text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">{displayedSummary}</pre>
                } 
            </div> 
        )
    )
}

export default Output