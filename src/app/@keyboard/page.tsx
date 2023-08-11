"use client";

export default function Keyboard() {
  return (
    <Root>
      <Header />
      <Container />
      <Footer>
        {/* desktop only */}
        {/* <Handle /> */}
      </Footer>
    </Root>
  );
}

const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex-col items-center absolute bg-keyboard w-full left-0 bottom-0 keyboardSafeArea">
      {children}
    </div>
  );
};

const Header = () => {
  return <div className="h-[54px]"></div>;
};

const Container = () => {
  return (
    <div className="grid grid-cols-5 grid-rows-4 gap-x-[16px] gap-y-[16px] w-[98%] aspect-[1.85]"></div>
  );
};

const Footer = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex w-full h-[40px] bottom-0">{children}</div>;
};

const Handle = () => {
  return (
    <div className="mt-[18px] mr-auto mb-0 ml-auto bg-[#aaa] w-[40px] h-[5px] rounded-[2px] hidden"></div>
  );
};
