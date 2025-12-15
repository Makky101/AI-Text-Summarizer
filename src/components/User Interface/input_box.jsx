function Input({shift, input, setInput}){
    {/* INPUT BOX */}
   return(
    <div className={`flex flex-col gap-3 transition-all duration-500 ease-out min-h-[250px] sm:min-h-[300px] 
        ${shift ? "lg:w-5/12 lg:-translate-x-2.5 w-full" : "w-full lg:w-7/12"}
    `}>
        <textarea
            className={`w-full h-full resize-none text-base bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl p-4 transition-all duration-250 ease-out outline-none overflow-auto placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent shadow-sm dark:shadow-none`}
            placeholder="Start typing here…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Text input for summarization"
        />     
    </div>
   )
}

export default Input