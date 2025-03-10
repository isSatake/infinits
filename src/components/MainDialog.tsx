import React, { FC, useState } from "react";
import { useAtom } from "jotai";
import { DialogState, showDialogAtom } from "@/state/atom";
import { Dialog } from "./Dialog";

export const MainDialog = () => {
  const [dialog, setDialog] = useAtom(showDialogAtom);
  return (
    <Dialog
      className="mainDialog"
      open={!!dialog}
      closeOnOuterClick={false}
      onClose={() => setDialog(undefined)}
    >
      {dialog?.type === "message" && <MessageDialog {...dialog} />}
      {dialog?.type === "input" && <InputDialog {...dialog} />}
    </Dialog>
  );
};

const MessageDialog: FC<{ type: "message" } & DialogState> = (props) => {
  return (
    <>
      <div className="title">{props.title}</div>
      <div className="buttons">
        {props.buttons.map((button, i) => (
          <button key={i} onClick={button.onClick}>
            {button.label}
          </button>
        ))}
      </div>
    </>
  );
};

const InputDialog: FC<{ type: "input" } & DialogState> = (props) => {
  const [value, setValue] = useState("");
  return (
    <>
      <div className="inputContainer">
        <input
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          placeholder={props.placeholder}
          onKeyDown={(e) => {
            if (!e.nativeEvent.isComposing && e.key === "Enter") {
              props.buttons[0].onClick(e.currentTarget.value);
            }
          }}
        />
      </div>
      <div className="buttons">
        {props.buttons.map((button, i) => (
          <button key={i} onClick={() => button.onClick(value)}>
            {button.label}
          </button>
        ))}
      </div>
    </>
  );
};
