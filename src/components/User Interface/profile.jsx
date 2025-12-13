const Profile = ({letter}) => {
    {/* Profile picture */}
    <div className="flex justify-center">
      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-400 flex items-center justify-center text-gray-700 text-sm sm:text-base">
        {letter}
      </div>
    </div>
}

export default Profile