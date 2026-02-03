import { Construct } from 'constructs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs'; 
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets';

interface MyAlbProps {
  readonly myVpc: ec2.IVpc;
  readonly myEcs: ecs.Ec2Service;
}

export class MyAlb extends Construct {
  public readonly myAlb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props : MyAlbProps) {
    super(scope, id);

    const sslCert = acm.Certificate.fromCertificateArn(
      this, 
      'MyCertAlb', 
      process.env['CERT_ARN']!,
    );

    this.myAlb = new elbv2.ApplicationLoadBalancer(this, 'MyAlb', {
      vpc: props.myVpc,
      internetFacing: true,
      idleTimeout: cdk.Duration.minutes(5), // maybe increase duration
    });

    const myHostedZone = route53.HostedZone.fromLookup(this, 'MyZone', {
      domainName: process.env['PROD_DOMAIN']!, 
    });

    new route53.ARecord(this, 'ApiAliasARecord', {
      zone: myHostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(this.myAlb)
      ),
    });

    new route53.AaaaRecord(this, 'ApiAliasAaaaRecord', {
      zone: myHostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(this.myAlb)
      ),
    });

    const httpsListener = this.myAlb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [sslCert],
      // if someone hits ALB IP directly
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.myVpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      targets: [
        props.myEcs.loadBalancerTarget({
          containerName: 'ExpressApp', // must match the name in ecs task definition
          containerPort: 3000,  
        }),
      ],
      stickinessCookieDuration: cdk.Duration.days(1),
      healthCheck: {
        port: '3000',
        path: '/api/health', 
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
      },
    });
    
    httpsListener.addTargetGroups('ApiTargets', {
      priority: 1,
      conditions: [
        elbv2.ListenerCondition.hostHeaders([`api.${process.env['PROD_DOMAIN']!}`]),
      ],
      targetGroups: [targetGroup]
    });

    // allow the ALB to talk to the ECS tasks
    props.myEcs.connections.allowFrom(this.myAlb, ec2.Port.tcp(3000));
  }
}