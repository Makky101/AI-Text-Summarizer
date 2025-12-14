function User({letter}){
  return(
    <div className="flex justify-center">
      <div className="w-10 h-10 sm:w-10 sm:10 rounded-full profile bg-gray-400 flex items-center justify-center text-gray-700 text-sm sm:text-base">
        {letter}
      </div>{/* Profile picture */}
    </div>
  )
}

export default User