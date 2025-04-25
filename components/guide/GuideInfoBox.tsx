import { ReactNode } from "react";

export function GuideInfoBox(props: { children: ReactNode }) {
  return (
    <div className="max-w-[768px] w-full overflow-hidden flex-col gap-5 flex text-md my-16 mx-auto">
      <div className="text-4xl text-center">
        ▲ <span className="font-semibold">+</span> 🦜🔗{" "}
        <span className="font-semibold">+</span>{" "}
        <span className="font-bold bg-gradient-to-br from-[#e0f2ff] to-[#1a7fff] text-transparent bg-clip-text">
          Gemini 2.0
        </span>
      </div>

      <div className="text-sm max-w-[600px] mx-auto text-center">
        {props.children}
      </div>
    </div>
  );
}
