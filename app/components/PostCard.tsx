type PostCardProps = {
    username: string;
    content: string;
  };
  
  export default function PostCard({ username, content }: PostCardProps) {
    return (
      <div className="bg-white/10 rounded-2xl p-6 text-center">
        <h2 className="text-xl font-bold">@{username}</h2>
        <p className="mt-2">{content}</p>
      </div>
    );
  }
  