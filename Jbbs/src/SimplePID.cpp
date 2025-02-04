/**********************************************************************************************
 * Arduino PID Library - Version 1.1.1
 * by Brett Beauregard <br3ttb@gmail.com> brettbeauregard.com
 *
 * This Library is licensed under a GPLv3 License
 **********************************************************************************************/

#include "SimplePID.h"
// #define DEBUG

/*Constructor (...)*********************************************************
 *    The parameters specified here are those for for which we can't set up 
 *    reliable defaults, so we need to have the user set them.
 ***************************************************************************/
SimplePID::SimplePID(double* Input, double* Output, double* Setpoint,
        double Kp, double Ki, double Kd, int ControllerDirection)
{
	
    myOutput = Output;
    myInput = Input;
    mySetpoint = Setpoint;
	inAuto = false;
	
	SimplePID::SetOutputLimits(0, 255);			//default output limit corresponds to
												//the arduino pwm limits
	SimplePID::SetControllerDirection(ControllerDirection);
	SimplePID::SetTunings(Kp, Ki, Kd);
	nextStop = *mySetpoint - 5;


}
 
 
/* Compute() **********************************************************************
 *     This, as they say, is where the magic happens.  this function should be called
 *   every time "void loop()" executes.  the function will decide for itself whether a new
 *   pid Output needs to be computed.  returns true when the output is computed,
 *   false when nothing has been done.
 **********************************************************************************/ 
bool SimplePID::Compute()
{

	if(!inAuto) return false;

   /*Compute all the working error variables*/
	double input = *myInput;
//	double myError = *mySetpoint - input;
	double output;

	/*Compute PID Output*/

	if (input >= *mySetpoint) {							// se supero il target, spengo
		output = outMin;
		nextStop = *mySetpoint;
		tempMax = 0;
	} else if (input < (*mySetpoint - 3)) {				// Se mancano ancora almeno 3 gradi, pompo al massimo
		output = outMax;
	} else {
														// Se mancano meno di 5 gradi, faccio scaricare
		if (input > tempMax) {							// la pentola e quando si erma accendo parzialmente,
			tempMax = input;							// per fermarmi di nuovo a met� strada rispetto al target,
		} 												// poi faccio ripartire e cos� via.

		if (input <= tempMax) {
			nextStop = (*mySetpoint + input) / 2;
			output = ((outMin + outMax ) / 2);
//			output = ((outMin + outMax ) * 2 / 3);
		}

		if (input >= nextStop) {
			output = outMin;
		}
	}

	*myOutput = output;

#ifdef DEBUG
	std::cout << "SimplePID::compute: " << "input: " << input << "; Setpoint: " << *mySetpoint << "; Output: " << *myOutput << std::endl;
#endif

	return true;
}


/* SetTunings(...)*************************************************************
 * This function allows the controller's dynamic performance to be adjusted. 
 * it's called automatically from the constructor, but tunings can also
 * be adjusted on the fly during normal operation
 ******************************************************************************/ 
void SimplePID::SetTunings(double Kp, double Ki, double Kd)
{
   if (Kp<0 || Ki<0 || Kd<0) return;
 
   dispKp = Kp; dispKi = Ki; dispKd = Kd;
   
   kp = Kp;
   ki = Ki;
   kd = Kd;
 
  if(controllerDirection ==REVERSE)
   {
      kp = (0 - kp);
      ki = (0 - ki);
      kd = (0 - kd);
   }
}
  
/* SetOutputLimits(...)****************************************************
 *     This function will be used far more often than SetInputLimits.  while
 *  the input to the controller will generally be in the 0-1023 range (which is
 *  the default already,)  the output will be a little different.  maybe they'll
 *  be doing a time window and will need 0-8000 or something.  or maybe they'll
 *  want to clamp it from 0-125.  who knows.  at any rate, that can all be done
 *  here.
 **************************************************************************/
void SimplePID::SetOutputLimits(double Min, double Max)
{
   if(Min >= Max) return;
   outMin = Min;
   outMax = Max;
 
   if(inAuto)
   {
	   if(*myOutput > outMax) *myOutput = outMax;
	   else if(*myOutput < outMin) *myOutput = outMin;
	 
	   if(ITerm > outMax) ITerm= outMax;
	   else if(ITerm < outMin) ITerm= outMin;
   }
}

/* SetMode(...)****************************************************************
 * Allows the controller Mode to be set to manual (0) or Automatic (non-zero)
 * when the transition from manual to auto occurs, the controller is
 * automatically initialized
 ******************************************************************************/ 
void SimplePID::SetMode(int Mode)
{
    bool newAuto = (Mode == AUTOMATIC);
    if(newAuto && !inAuto)
    {  /*we just went from manual to auto*/
    	SimplePID::Initialize();
    }
    inAuto = newAuto;
}
 
/* Initialize()****************************************************************
 *	does all the things that need to happen to ensure a bumpless transfer
 *  from manual to automatic mode.
 ******************************************************************************/ 
void SimplePID::Initialize()
{
   ITerm = *myOutput;
   if (ITerm > outMax) {
	   ITerm = outMax;
   } else if (ITerm < outMin) {
	   ITerm = outMin;
   }
	tempStart = 0;
	tempMax = 0;


}

/* SetControllerDirection(...)*************************************************
 * The PID will either be connected to a DIRECT acting process (+Output leads 
 * to +Input) or a REVERSE acting process(+Output leads to -Input.)  we need to
 * know which one, because otherwise we may increase the output when we should
 * be decreasing.  This is called from the constructor.
 ******************************************************************************/
void SimplePID::SetControllerDirection(int Direction)
{
   if(inAuto && Direction !=controllerDirection)
   {
	  kp = (0 - kp);
      ki = (0 - ki);
      kd = (0 - kd);
   }   
   controllerDirection = Direction;
}

/* Status Funcions*************************************************************
 * Just because you set the Kp=-1 doesn't mean it actually happened.  these
 * functions query the internal state of the PID.  they're here for display 
 * purposes.  this are the functions the PID Front-end uses for example
 ******************************************************************************/
double SimplePID::GetKp(){ return  dispKp; }
double SimplePID::GetKi(){ return  dispKi;}
double SimplePID::GetKd(){ return  dispKd;}
int SimplePID::GetMode(){ return  inAuto ? AUTOMATIC : MANUAL;}
int SimplePID::GetDirection(){ return controllerDirection;}
