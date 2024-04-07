import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';


export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const setDirectoryPathFunction = new lambda.Function(this, 'MyLambdaFunction', {
      code: lambda.Code.fromInline(`
        exports.handler = async (event, context) => {
          // 現在の日付・時刻を取得する
          let now = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));

          let year = new Date(now).getFullYear();
          let month = new Date(now).getMonth() + 1;
          let day = new Date(now).getDate();
          let hour = new Date(now).getHours();
          let minutes = new Date(now).getMinutes();

          let dir = event.resouce + "/" +year + "/" + month + "/" + day + "/" + hour + "" + minutes + "/"
          return {
              'directoryPath': dir,
              'tableName': event.resouce + "_"+ String(year) + String(month) + String(day) + String(hour) + String(minutes)
          }
        };
      `),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      timeout: cdk.Duration.seconds(3)
    });


    const pass = new sfn.Pass(this, 'pass-result', {
      stateName: 'my-pass-state', 
      resultPath: '$.strings.lambdaresult$.strings.lambdaresult',
    })
    

    const postFuction = new lambda.Function(this, 'PostLambdaFunction', {
      code: lambda.Code.fromInline(`
        exports.handler = async (event, context) => {
          console.log(event.Payload.tableName)
          return {
              'directoryPathA': event.Payload.directoryPath
          }
        };
      `),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      timeout: cdk.Duration.seconds(3)
    });



    const convertValueFormatTask = new tasks.LambdaInvoke(
      this,
      'convertValueFormatTask',
      {
        lambdaFunction: setDirectoryPathFunction,
        payload: sfn.TaskInput.fromJsonPathAt('$'),
        payloadResponseOnly: false //未指定なら既定でfalseとなる

      }
    );

    const postFunctionConvertValueFormatTask = new tasks.LambdaInvoke(
      this,
      'postFunctionConvertValueFormatTask',
      {
        lambdaFunction: postFuction,
        payload: sfn.TaskInput.fromJsonPathAt('$'),
        payloadResponseOnly: false //未指定なら既定でfalseとなる

      }
    );

    // const definition = evaluateTask.next(convertValueFormatTask);

    const stateMachine = new sfn.StateMachine(this, 'MyStateMachine', {
      stateMachineName: 'testStateMachine',
      definition: convertValueFormatTask.next(pass).next(postFunctionConvertValueFormatTask),
    });  


  }
}
