const CURSOR_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#EC4899', // pink
];

export default function UserCursors({ users, currentUserId }) {
  const otherUsers = users.filter(user => 
    user.id !== currentUserId && 
    user.cursorPosition && 
    Date.now() - user.lastSeen < 10000 // Only show cursors from users active in last 10 seconds
  );

  return (
    <>
      {otherUsers.map((user, index) => {
        if (!user.cursorPosition) return null;
        
        const colorIndex = index % CURSOR_COLORS.length;
        const color = CURSOR_COLORS[colorIndex];
        
        return (
          <div
            key={user.id}
            className="absolute pointer-events-none z-10 transition-all duration-100"
            style={{
              left: `${user.cursorPosition.x}px`,
              top: `${user.cursorPosition.y}px`,
              transform: 'translate(-2px, -2px)'
            }}
          >
            <div className="relative">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className="drop-shadow-sm"
              >
                <path
                  d="M0 0L6 14L9 9L14 6L0 0Z"
                  fill={color}
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>
              <span
                className="absolute left-4 top-0 text-white text-xs px-2 py-1 rounded whitespace-nowrap text-shadow drop-shadow-sm"
                style={{ backgroundColor: color }}
              >
                User {user.id.slice(-4)}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}