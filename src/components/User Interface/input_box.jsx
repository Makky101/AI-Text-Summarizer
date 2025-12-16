/**
 * Input component - Text area for user input with responsive animations
 * @param {boolean} shift - Controls width and positioning animation
 * @param {string} input - Current input text value
 * @param {function} setInput - Function to update input state
 */
function Input({shift, input, setInput}){
   return(
    // Container with responsive width and animation based on shift prop
    <div className={`flex flex-col gap-3 transition-all duration-500 ease-out min-h-[250px] sm:min-h-[300px]
        ${shift ? "lg:w-5/12 lg:-translate-x-2.5 w-full" : "w-full lg:w-7/12"}
    `}>
        {/* Textarea for user input with theme-aware styling */}
        <textarea
            className={`min-h-[200px] max-h-[400px] sm:min-h-[350px] resize-none text-base bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl p-4 transition-all duration-250 ease-out outline-none overflow-auto placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent shadow-sm dark:shadow-none`}
            placeholder="Start typing here…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Text input for summarization"
        />
    </div>
   )
}

export default Input
