// TODO: for implementing email verification, and password and email change confirmation

import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface MySesProps {
  readonly myVpc: ec2.IVpc;
}

export class MySes extends Construct {
  // public readonly mySes: ;

  constructor(scope: Construct, id: string, props : MySesProps) {
    super(scope, id);

  }
}