/**
 * User component - Displays user avatar with first letter of username
 * @param {string} letter - First letter of the user's username (capitalized)
 */
function User({letter}){
  return(
    <div className="flex justify-center">
      {/* Circular avatar displaying the first letter of username */}
      <div className="w-10 h-10 sm:w-10 sm:h-10 rounded-full profile bg-gray-400 flex items-center justify-center text-gray-700 text-sm sm:text-base">
        {letter}
      </div>
    </div>
  )
}

export default User
