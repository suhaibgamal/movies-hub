import Link from "next/link";

const page = () => {
  return (
    <div className="text-3xl flex flex-col items-center font-semibold text-gray-300 text-center mt-10">
      <p>OOPS! No Movie Here!</p>
      <Link
        href="/"
        className="w-fit mt-5 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-white hover:from-blue-500 hover:to-purple-500 transition-all text-sm"
      >
        Home
      </Link>
    </div>
  );
};

export default page;
