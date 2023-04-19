/*
 * testlcd.cpp
 *
 *  Created on: Apr 25, 2017
 *      Author: mizio
 */

#include "JbbsLcd.h"

// --------------------------------------------------------------
// Setup
// --------------------------------------------------------------
JbbsLcd::JbbsLcd(const int lcdAddress, const int gpioBase) {

	pcf8574Setup (gpioBase,  lcdAddress);
	for (int i= 0; i < 8; i++) {
		pinMode (gpioBase + i, OUTPUT) ;
	}

	// Definisco i GPIO utilizzati dal pcf8574 per interfacciarsi con l'LCD
	lcdRS_	= gpioBase;
	lcdRW_	= gpioBase + 1;
	lcdE_	= gpioBase + 2;
	lcdBL_	= gpioBase + 3; // Backlight
	lcdDB4_	= gpioBase + 4;
	lcdDB5_	= gpioBase + 5;
	lcdDB6_	= gpioBase + 6;
	lcdDB7_	= gpioBase + 7;

	lcd_ = lcdInit (4, 20, 4, lcdRS_, lcdE_, lcdDB4_,lcdDB5_,lcdDB6_,lcdDB7_, 0,0,0,0);
	bar_ = new ProgressBar(lcd_, rowBar_, 0, 20);
	barPercent_ = 0;

	lcdHome(lcd_);
	lcdClear(lcd_);
	digitalWrite(lcdBL_, 1); // Accendo l'illuminazione del display

}

void JbbsLcd::draw() {

	// Disegno temperatura di sparge
	lcdPosition(lcd_, colSparge_, rowSparge_);
	lcdPrintf(lcd_, "%4.1f", tempSparge_);

	// Disegno temperatura di mash
	lcdPosition(lcd_, colMash_, rowMash_);
	lcdPrintf(lcd_, "%4.1f", tempMash_);

	// Disegno temperatura di boil
	lcdPosition(lcd_, colBoil_, rowBoil_);
	lcdPrintf(lcd_, "%5.1f", tempBoil_);

	// Stampo la descrizione dello Step in esecuzione
	lcdPosition(lcd_, (numLcdCols_ - strlen(lblStep_)) / 2, rowStep_);
	lcdPuts(lcd_, lblStep_);

	// Disegno la barra di avanzamento
	bar_->draw(barPercent_, barLeftlabel_, barRightlabel_);

}

void JbbsLcd::setTempSparge(float temp){
	tempSparge_ = temp;
}
void JbbsLcd::setTempMash(float temp){
	tempMash_ = temp;
}
void JbbsLcd::setTempBoil(float temp){
	tempBoil_ = temp;
}
void JbbsLcd::setStepLabel(const char* label){
	lblStep_ = label;
}
void JbbsLcd::setBarPercent(int percent){
	barPercent_ = percent;
}
void JbbsLcd::setBarLeftLabel(const char* label){
	strcpy(barLeftlabel_, label);
}
void JbbsLcd::setBarRightLabel(const char* label){
	strcpy(barRightlabel_, label);
}

