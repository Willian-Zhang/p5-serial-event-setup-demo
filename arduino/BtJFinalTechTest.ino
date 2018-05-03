//Include needed libraries
#include <CapacitiveSensor.h>

CapacitiveSensor touchSensor = CapacitiveSensor(3,2);

//PINS
const int piezoPin = A0;
const int bendPin = A1;
const int photoPin = A2;
const int button1Pin = 5;
const int button2Pin = 6;
const int button3Pin = 7;

//SENSOR VALUES
int piezoValue;
int bendValue;
int photoValue;
int touchValue;
int button1Value;
int button2Value;
int button3Value;

void setup() {

  //Pin mode settings
  pinMode(piezoPin, INPUT);
  pinMode(bendPin, INPUT);
  pinMode(photoPin, INPUT);
  pinMode(button1Pin, INPUT);
  pinMode(button2Pin, INPUT);
  pinMode(button3Pin, INPUT);

  //initialize serial communication at 9600 bits per second
  Serial.begin(9600);

}

void loop() {
  // get sensor values
  piezoValue = analogRead(piezoPin);
  bendValue = 1024-analogRead(bendPin);
  photoValue = analogRead(photoPin);
  touchValue = touchSensor.capacitiveSensor(30);
  button1Value = digitalRead(button1Pin);
  button2Value = digitalRead(button2Pin);
  button3Value = digitalRead(button3Pin);

//  //display sensor values
//  Serial.print("Piezo: "); Serial.print(piezoValue);
//  Serial.print("\tBend: "); Serial.println(bendValue);
//  Serial.print("Photo: "); Serial.print(photoValue);
//  Serial.print("\tTouch: "); Serial.println(touchValue);
//  Serial.print("Button 1: "); Serial.print(button1Value);
//  Serial.print("\tButton 2: "); Serial.println(button2Value);
//  Serial.print("Button 3: "); Serial.println(button3Value); Serial.println();

//API format: <sensor1>\t<sensor2>\t<sensor3>\t<sensor4>\t<sensor5>\n
Serial.print(piezoValue);
Serial.print("\t");
Serial.print(bendValue);
Serial.print("\t");
Serial.print(touchValue);
Serial.print("\t");
Serial.print(button1Value);
Serial.print("\t");
Serial.print(button2Value);
Serial.print("\t");
Serial.print(button3Value);
Serial.print("\n");

  //delay to keep the arduino sane
}
