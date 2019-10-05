import React from "react";
import { OverlayTrigger, Tooltip, Button } from "react-bootstrap";

export default function ButtonHelp(props) {
  const { disabledHelp, ...btnProps } = props;

  // if (!props.disabled) {
  //   return <Button {...btnProps} />;
  // }
  if (props.disabled) {
    return (
      <OverlayTrigger
        trigger="hover"
        placement="top"
        overlay={() => <Tooltip>{disabledHelp}</Tooltip>}
      >
        <Button {...btnProps} />
      </OverlayTrigger>
    );
  }

  return <Button {...btnProps} />;
}
