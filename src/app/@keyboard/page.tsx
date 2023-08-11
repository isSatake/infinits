"use client";

export default function Keyboard() {
  return (
    // root
    <div className="flex-col items-center absolute bg-keyboard w-full left-0 bottom-0 keyboardSafeArea">
      {/* header */}
      <div className="h-[54px]"></div>
      {/* container */}
      <div className="grid grid-cols-5 grid-rows-4 gap-x-[16px] gap-y-[16px] w-[98%] aspect-[1.85]"></div>
      {/* footer */}
      <div className="flex w-full h-[40px] bottom-0">
        {/* handle */}
        <div className="mt-[18px] mr-auto mb-0 ml-auto bg-[#aaa] w-[40px] h-[5px] rounded-[2px] hidden"></div>
      </div>
    </div>
  );
}
