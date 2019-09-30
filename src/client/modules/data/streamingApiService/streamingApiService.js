export const getCaseData = () => {
    /*
  ! Kevin, the TH pattern has this module defining a function that hits an /api/* endpoint defined in server/index.js
  ! Not sure if we need to do that for the streaming api? Individual components then hit the function defined here to 
  ! get and transform the data into something usable. Because the streaming api is going to setup a persistent 
  ! connection to the SF server, it may ultimately need to be invoked client side, in the individual component template.
  ! Ideally, however, the server would maintain that single connection to SF and we'd multiplex it out to N dashboard 
  ! instances. Thoughts?
  */
};
