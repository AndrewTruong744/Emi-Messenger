import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { RemovalPolicy } from 'aws-cdk-lib';

export class MyVpc extends Construct {
  public readonly myVpc: ec2.Vpc;
  public readonly ecsSG: ec2.SecurityGroup;
  public readonly elasticacheSG: ec2.SecurityGroup;
  public readonly rdsSG: ec2.SecurityGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const fckNatImage = new ec2.LookupMachineImage({
      name: 'fck-nat-al2023-*-arm64-ebs',
      owners: ['568608671756']
    });

    const natProvider = ec2.NatProvider.instanceV2({
      instanceType: new ec2.InstanceType('t4g.nano'),
      machineImage: fckNatImage,
      associatePublicIpAddress: true,

      // only accept requests from backend and responses to backend's requests
      defaultAllowedTraffic: ec2.NatTrafficDirection.OUTBOUND_ONLY,  
    });

    // virtual private cloud to protect important backend services
    this.myVpc = new ec2.Vpc(this, 'VpcService', {
      maxAzs: 2,
      natGateways: 1,
      natGatewayProvider: natProvider,
    });

    // allows vpc traffic to go through fck nat
    natProvider.connections.allowFrom(
      ec2.Peer.ipv4(this.myVpc.vpcCidrBlock),
      ec2.Port.allTraffic(),
    );

    const s3Endpoint = this.myVpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });
    s3Endpoint.node.addDependency(natProvider.gatewayInstances[0]);

    const eIp = new ec2.CfnEIP(this, 'NatEIP', {
      domain: 'vpc'
    });

    // makes sure that elastic IP is destroyed on cdk destroy
    eIp.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // for each nat in each subnet, add the elastic ip to it
    natProvider.gatewayInstances.forEach((instance, index) => {
      new ec2.CfnEIPAssociation(this, `NatEIPAssociation${index}`, {
        allocationId: eIp.attrAllocationId,
        instanceId: instance.instanceId,
      });
    });

    this.ecsSG = new ec2.SecurityGroup(this, 'EcsSG', {
      vpc: this.myVpc,
      allowAllOutbound: true
    });
    this.elasticacheSG = new ec2.SecurityGroup(this, 'ElasticacheSG', {
      vpc: this.myVpc,
      allowAllOutbound: true
    });
    this.rdsSG = new ec2.SecurityGroup(this, 'RdsSG', {
      vpc: this.myVpc,
      allowAllOutbound: true,
    });

    // connects ecs and elasticache security groups together
    this.elasticacheSG.addIngressRule(this.ecsSG, ec2.Port.tcp(6379));

    // connects ecs and rds security groups together
    this.rdsSG.addIngressRule(this.ecsSG, ec2.Port.tcp(5432));
  }
}