export default function Header() {
  return (
    <header className="flex justify-between items-center p-8 text-black">
      <div className="flex items-center">
        <h1 className="ml-2 text-xl font-bold">要約訓練</h1>
      </div>
      <div>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          ログイン
        </button>
      </div>
    </header>
  );
}
