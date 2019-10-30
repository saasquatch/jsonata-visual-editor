import React, {useMemo} from "react";
import { OverlayTrigger, Tooltip, Button } from "react-bootstrap";

type ButtonProps = React.ComponentProps<typeof Button>;
type ButtonHelpProps = ButtonProps & {
  disabledHelp: string;
  children: React.ReactNode;
};
export default function ButtonHelp(props: ButtonHelpProps) {
  const { disabledHelp, ...btnProps } = props;

  if (props.disabled) {
    /* 
    Need to ignore the actual Click and Disabled events. 
    If you actually disable the button, then hover events 
    and other mouse events won't fire, and the tooltip won't work
     */
    const { onClick, disabled, ...subProps } = btnProps;
    return (
      <OverlayTrigger
        trigger="hover"
        placement="top"
        overlay={<Tooltip id={"tooltip" + Math.random()}>{disabledHelp}</Tooltip>}
      >
        <span>
          <Button {...subProps} className="disabled" />
        </span>
      </OverlayTrigger>
    );
  }

  return <Button {...btnProps} />;
}
