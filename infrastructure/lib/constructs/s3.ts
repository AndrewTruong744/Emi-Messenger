// TODO: for implementing file uploads and setting profile pictures

import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface MyS3Props {
  readonly myVpc: ec2.IVpc;
}

export class MyS3 extends Construct {
  // public readonly myS3: ;

  constructor(scope: Construct, id: string, props : MyS3Props) {
    super(scope, id);

  }
}